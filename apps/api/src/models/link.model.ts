import { Schema, model } from "mongoose";

const linkSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    originalUrl: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["active", "disabled"],
        default: "active",
        required: true,
    },
},
    {
        timestamps: true,
        collection: "links",
    },
);
const clickEventSchema = new Schema(
    {
        linkId: {
            type: Schema.Types.ObjectId,
            ref: "Link",
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    {
        collection: "click_events",
    },
);

clickEventSchema.index({ linkId: 1, timestamp: -1 });

clickEventSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
linkSchema.index({ ownerId: 1, createdAt: -1 });
export const Link = model("Link", linkSchema);
export const clickEvent = model("ClickEvent", clickEventSchema);