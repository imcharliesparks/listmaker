import { Router } from "express";
import {
  createList,
  deleteList,
  getListById,
  getUserLists,
  updateList,
} from "../controllers/listsController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/", createList);
router.get("/", getUserLists);
router.get("/:id", getListById);
router.put("/:id", updateList);
router.delete("/:id", deleteList);

export default router;
