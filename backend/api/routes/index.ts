import Router from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);
// router.use('/products', productRoutes); -> if you have more routes, you can add them here

export default router;