import { Router, type Request, type Response } from 'express';
import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  type Profile,
  type StrategyOptions,
} from 'passport-google-oauth20';
import { env } from '../../config/env';
import { authService } from './auth.service';

export const googleAuthRouter = Router();

if (env.googleOAuthEnabled) {
  const strategyOptions: StrategyOptions = {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL,
  };
  const verify = async (
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: unknown, user?: unknown) => void,
  ) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Google profile has no email'));
      const result = await authService.loginOrCreateOAuth({
        email,
        name: profile.displayName || email,
        providerId: profile.id,
        avatarUrl: profile.photos?.[0]?.value,
      });
      return done(null, result);
    } catch (err) {
      return done(err);
    }
  };
  // Cast to bypass overload mismatch in @types/passport-google-oauth20
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.use(new (GoogleStrategy as any)(strategyOptions, verify));

  googleAuthRouter.get(
    '/',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
  );

  googleAuthRouter.get(
    '/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.FRONTEND_URL}/login?error=oauth`,
    }),
    (req: Request, res: Response) => {
      const result = req.user as { token: string } | undefined;
      if (!result?.token) return res.redirect(`${env.FRONTEND_URL}/login?error=oauth`);
      return res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${result.token}`);
    },
  );
} else {
  const disabled = (_req: Request, res: Response) =>
    res.status(503).json({
      success: false,
      error: {
        code: 'OAUTH_DISABLED',
        message:
          'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.',
      },
    });
  googleAuthRouter.get('/', disabled);
  googleAuthRouter.get('/callback', disabled);
}
