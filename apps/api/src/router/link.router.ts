import { Router } from "express";
import handleGenerateShortUrl from '../controllers/link.controller'


const router = Router();

router.post("/", handleGenerateShortUrl);

export default router;
