import { Router } from "express";
import { addItem, deleteItem, getItemById, getListItems } from "../controllers/itemsController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/", addItem);
router.get("/list/:listId", getListItems);
router.get("/:id", getItemById);
router.delete("/:id", deleteItem);

export default router;
