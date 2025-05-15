import express, { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { PinataSDK } from 'pinata'

const pinataJwt = process.env.PINATA_JWT
const pinataGateway = process.env.PINATA_GATEWAY

if (!pinataJwt || !pinataGateway) {
  console.warn('Pinata JWT or Gateway not configured. Please set PINATA_JWT and PINATA_GATEWAY environment variables.')
}

const pinata = pinataJwt && pinataGateway ? new PinataSDK({ pinataJwt, pinataGateway }) : null
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'))
    }
  },
})

const router: Router = express.Router()

/**
 * PUBLIC
 * POST /api/nft/upload-image
 * Uploads an image file to Pinata
 */
router.post(
  '/upload-image',
  upload.single('nftImage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!pinata) {
      res.status(500).json({ message: 'Pinata service is not configured on the server.' })
      return
    }
    if (!req.file) {
      res.status(400).json({ message: 'No image file uploaded.' })
      return
    }

    try {
      const imageFileBuffer = req.file.buffer
      const originalFileName = req.file.originalname
      const mimeType = req.file.mimetype
      const fileToUpload = new File([imageFileBuffer], originalFileName, { type: mimeType })
      const result = await pinata.upload.public.file(fileToUpload).name(`nft-image-${Date.now()}-${originalFileName}`)
      const cid = result.cid

      if (!cid) {
        console.error('Pinata upload result did not contain a CID or IpfsHash:', result)
        res.status(500).json({ message: 'Failed to get CID from Pinata response.' })
        return
      }

      res.status(200).json({
        message: 'Image uploaded successfully to Pinata!',
        cid: cid,
        pinataUrl: `${pinataGateway}/ipfs/${cid}`,
      })
    } catch (error) {
      console.error('Error uploading image to Pinata:', error)
      next(error)
    }
  }
)

/**
 * PUBLIC
 * POST /api/nft/upload-metadata
 * Uploads metadata to Pinata
 */
router.post('/upload-metadata', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!pinata) {
    res.status(500).json({ message: 'Pinata service is not configured on the server.' })
    return
  }

  const metadataObject = req.body

  if (!metadataObject.name || !metadataObject.image || !metadataObject.description) {
    res.status(400).json({
      message: 'Invalid or incomplete metadata.',
    })
    return
  }

  try {
    const safeMetadataName = (metadataObject.name || 'nft_metadata')
      .toString()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '')
    const pinataEntryName = `${safeMetadataName}-${Date.now()}.json`
    const result = await pinata.upload.public.json(metadataObject).name(pinataEntryName)
    const cid = result.cid

    if (!cid) {
      console.error('Pinata metadata upload result did not contain a CID:', result)
      res.status(500).json({ message: 'Failed to get CID from Pinata metadata response.' })
      return
    }

    res.status(200).json({
      message: 'Metadata uploaded successfully to Pinata!',
      cid: cid,
      pinataUrl: `${pinataGateway}/ipfs/${cid}`,
    })
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error)
    next(error)
  }
})

export default router
