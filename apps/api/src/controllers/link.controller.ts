import { nanoid } from 'nanoid';
import { Link } from '../models/link.model.ts'
import type { Request, Response } from "express";

async function handleGenerateShortUrl(
    req: Request,
    res: Response,
) {
    const body = req.body;
    if (!body?.originalUrl) {
        return res.status(400).json({
            error: "originalUrl is required",
        });
    }
    const shortBaseUrl = process.env.SHORT_BASE_URL;

    if (!shortBaseUrl) {
        throw new Error("SHORT_BASE_URL is missing");
    }
    const code = nanoid(8);
    const link = await Link.create({
        code,
        originalUrl: body.originalUrl,
    });
    const shortUrl = new URL(`/r/${link.code}`, shortBaseUrl).href;
    return res.status(201).json({
        id: link._id.toString(),
        code: link.code,
        originalUrl: link.originalUrl,
        shortUrl,
        createdAt: link.createdAt,
    });
};

export default handleGenerateShortUrl;
