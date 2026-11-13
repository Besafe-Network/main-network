import express from 'express';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { workerSocketHub } from '../shared/worker-transport';
import { registerAuthRoutes } from './routes/auth';
import { registerDirectoryRoutes } from './routes/directory';
import { registerIntegrationsRoutes } from './routes/integrations';
import { registerPublicRoutes } from './routes/public';
import { registerBanCasesRoutes } from './routes/ban-cases';

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

export function startDashboardHttpServer(app: express.Express, context: any) {
  const {
    serviceName,
    port,
    workerAuthToken,
    vite,
    routeContext,
    findUserByQuery,
    resolveDiscordUser,
    getWatchlistAvatar,
    client,
    User,
    BanCase,
  } = context;

  registerAuthRoutes(app, routeContext);
  registerDirectoryRoutes(app, routeContext);
  registerIntegrationsRoutes(app, routeContext);
  registerPublicRoutes(app, routeContext);
  registerBanCasesRoutes(app, routeContext);

  app.all('/api/*', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const msg = String(err?.message || '');
    if (
      err?.name === 'MongooseError' ||
      err?.name === 'MongoNetworkError' ||
      msg.includes('buffering timed out') ||
      msg.includes('must be connected before running operations')
    ) {
      console.warn('[Database Offline] Returning fallback response for', req.method, req.path);
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  app.get([
    '/', '/check', '/check/:id', '/appeal', '/dashboard', '/verify', '/docs',
    '/docs/private', '/reset-password', '/verify-email', '/instructions',
    '/watchlist', '/watchlist/:id', '/terms', '/privacy', '/report',
    '/request-api-key', '/apply-api-key', '/api-key', '/developers', '/devs', '/enterprise',
  ], async (req: any, res, next) => {
    try {
      const pathParts = req.path.split('/');
      const isWatchlistDetail = pathParts[1] === 'watchlist' && pathParts[2];
      const isCheckDetail = pathParts[1] === 'check' && (pathParts[2] || req.query.id || req.query.query || req.query.user);
      const targetId = isWatchlistDetail
        ? pathParts[2]
        : isCheckDetail
          ? pathParts[2] || req.query.id || req.query.query || req.query.user
          : null;

      let user: any = null;
      let banCase: any = null;
      if (targetId) {
        const match = await findUserByQuery(String(targetId)).catch(() => null);
        user = match?.user || null;
        banCase = match?.banCase || null;
        if (!user && !banCase) {
          banCase = await BanCase.findOne({
            $or: [
              { caseNumber: new RegExp(`^${targetId}$`, 'i') },
              { 'discordAccounts.discordId': targetId },
              { 'discordAccounts.username': new RegExp(`^${targetId}$`, 'i') },
              { title: new RegExp(String(targetId), 'i') },
            ],
          }).catch(() => null);
        }
        if (!user && !banCase) {
          user = await User.findOne({
            $or: [
              { id: targetId },
              { username: new RegExp(`^${targetId}$`, 'i') },
              { displayName: new RegExp(`^${targetId}$`, 'i') },
            ],
          }).catch(() => null);
        }
      }

      const indexPath = process.env.NODE_ENV === 'production'
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html');
      if (!fs.existsSync(indexPath)) return next();

      let title = 'BeSafe Network | Global Identity & Safety Layer';
      let description = 'Global identity checks and safety tools for online communities.';
      let image = 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=600&auto=format&fit=crop';
      let themeColor = '#141414';
      const pathLower = req.path.toLowerCase();

      if (banCase || user) {
        const resolved = user ? await resolveDiscordUser(client, user.id, user).catch(() => null) : null;
        const subject = banCase?.title || user?.displayName || user?.username || resolved?.displayName || String(targetId);
        const avatar = banCase?.discordAccounts?.[0]?.avatarUrl || (user ? await getWatchlistAvatar(client, user).catch(() => null) : null);
        title = `${subject} | BeSafe Network`;
        description = banCase?.reason || user?.banReason || `BeSafe identity and safety information for ${subject}.`;
        image = avatar || image;
        themeColor = banCase?.status === 'active' || user?.isDangerous ? '#DC2626' : '#10B981';
      } else if (pathLower.startsWith('/watchlist')) {
        title = 'BeSafe Network | Watchlist';
        description = 'Safety watchlist and identity information.';
      } else if (pathLower.startsWith('/check')) {
        title = 'BeSafe Network | Identity Check';
        description = 'Check identity and safety information.';
      } else if (pathLower === '/dashboard') {
        title = 'BeSafe Network | Dashboard';
        description = 'Manage connected communities and safety settings.';
      }

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost'}`;
      const pageUrl = `${baseUrl.replace(/\/$/, '')}${req.originalUrl}`;
      const tags = `<title>${escapeAttribute(title)}</title>
<meta name="description" content="${escapeAttribute(description)}">
<meta property="og:title" content="${escapeAttribute(title)}">
<meta property="og:description" content="${escapeAttribute(description)}">
<meta property="og:image" content="${escapeAttribute(image)}">
<meta property="og:url" content="${escapeAttribute(pageUrl)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${themeColor}">`;

      let html = fs.readFileSync(indexPath, 'utf8');
      if (vite) html = await vite.transformIndexHtml(req.originalUrl, html);
      html = html.replace(/<title>[^]*?<\/title>/i, tags);
      res.status(200).type('html').send(html);
    } catch (error) {
      console.error('[Dashboard Metadata] Failed to render metadata:', error);
      next();
    }
  });

  if (vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const httpServer = createServer(app);
  workerSocketHub.attach(httpServer, workerAuthToken || '');
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Web Dashboard] Listening on http://0.0.0.0:${port} (${serviceName})`);
  });
  return httpServer;
}