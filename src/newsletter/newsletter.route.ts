import { Router } from 'express';
import { NewsletterController } from './newsletter.controller';
import { validateNewsletterSignup } from './newsletter-schema.validator';

const router: Router = Router();

router.post('/', validateNewsletterSignup, NewsletterController.signup);

export default router;
