import type { Request, Response } from "express";
import { Link } from "../models/link.model.js";

export async function handleRedirect(req: Request, res: Response) {
    // Read the short code from the URL, for example /r/Nyfq3oQ_.
    const code = req.params.code;

    // Find the MongoDB document containing that code.
    const link = await Link.findOne({ code });

    if (!link) {
        return res.status(404).json({
            error: "Link not found",
        });
    }

    if (link.status === "disabled") {
        return res.status(410).json({
            error: "This link is disabled",
        });
    }

    // Prevent caching from bypassing future click tracking.
    res.setHeader("Cache-Control", "no-store");

    return res.redirect(302, link.originalUrl);
}