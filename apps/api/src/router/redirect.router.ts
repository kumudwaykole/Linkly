import { Router } from "express";
import { handleRedirect } from "../controllers/redirect.controller";

const redirectRouter = Router();
redirectRouter.get("/:code", handleRedirect);

export default redirectRouter;
