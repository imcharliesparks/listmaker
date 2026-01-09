import { Router } from "express";
import { addItem, deleteItem, getListItems } from "../controllers/itemsController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/", addItem);
router.get("/list/:listId", getListItems);
router.delete("/:id", deleteItem);

export default router;
