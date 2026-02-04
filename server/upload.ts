import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { randomBytes } from "crypto";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const randomSuffix = randomBytes(8).toString("hex");
    const fileKey = `chat-files/${Date.now()}-${randomSuffix}-${file.originalname}`;

    const { url } = await storagePut(
      fileKey,
      file.buffer,
      file.mimetype
    );

    res.json({
      url,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
