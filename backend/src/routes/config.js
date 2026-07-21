import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  const publicUrl = process.env.PUBLIC_URL || 'http://localhost:8083';
  const isLocalhost =
    publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1');
  const isNgrok = publicUrl.includes('ngrok');

  let phoneWarning = null;
  if (isLocalhost) {
    phoneWarning =
      'PUBLIC_URL = localhost → QR codes inutilisables sur téléphone. Lance ./scripts/ngrok-dev.sh (recommandé en dev WSL).';
  } else if (isNgrok) {
    phoneWarning = null; // OK pour téléphone
  }

  res.json({
    publicUrl,
    phoneAccess: !isLocalhost,
    isNgrok,
    phoneWarning,
    ngrokHint: isLocalhost
      ? 'Dev téléphone : ajoute NGROK_AUTHTOKEN dans .env puis ./scripts/ngrok-dev.sh'
      : null,
  });
});

export default router;
