import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import ingredientsRouter from "./ingredients";
import productsRouter from "./products";
import recipesRouter from "./recipes";
import salesRouter from "./sales";
import wastingRouter from "./wasting";
import stockRouter from "./stock";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(ingredientsRouter);
router.use(productsRouter);
router.use(recipesRouter);
router.use(salesRouter);
router.use(wastingRouter);
router.use(stockRouter);
router.use(reportsRouter);

export default router;
