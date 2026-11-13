import { BanCase, Report, User, extractVRChatUserId } from '../shared/models';

export async function findUserByQuery(query: string) {
  const rawTrimmed = (query || '').trim();
  const cleaned = extractVRChatUserId(rawTrimmed);
  if (!cleaned && !rawTrimmed) return { user: null, banCase: null, cleaned: '' };

  const targetQuery = cleaned || rawTrimmed;
  let banCase = await BanCase.findOne({
    $or: [
      { caseNumber: targetQuery.toUpperCase() },
      { caseNumber: targetQuery },
      { 'discordAccounts.discordId': targetQuery },
      { 'discordAccounts.username': new RegExp(`^${targetQuery}$`, 'i') },
      { 'vrchatAccounts.vrchatUserId': targetQuery },
      { 'vrchatAccounts.vrchatUsername': new RegExp(`^${targetQuery}$`, 'i') },
    ],
  }).lean();

  let user = await User.findOne({
    $or: [
      { id: targetQuery },
      { vrchatUserId: targetQuery },
      { 'vrchatAlts.vrchatUserId': targetQuery },
      { vrchatUsername: new RegExp(`^${targetQuery}$`, 'i') },
    ],
  });

  if (!user && banCase) {
    const firstDiscord = banCase.discordAccounts?.find((account: any) => account?.discordId);
    if (firstDiscord) user = await User.findOne({ id: firstDiscord.discordId });

    if (!user) {
      const primaryVRChat = banCase.vrchatAccounts?.[0];
      const primaryDiscord = banCase.discordAccounts?.[0];
      const fallbackId = primaryDiscord?.discordId || primaryVRChat?.vrchatUserId || targetQuery;

      user = new User({
        id: fallbackId,
        username: primaryDiscord?.username || primaryVRChat?.vrchatUsername || fallbackId,
        isBanned: banCase.status === 'active',
        banReason: banCase.reason,
        banType: banCase.severity === 'temporary' ? 'temporary' : 'permanent',
        bannedBy: banCase.bannedBy || 'Administrator',
        bannedAt: banCase.createdAt || new Date(),
        vrchatUserId: primaryVRChat?.vrchatUserId || '',
        vrchatUsername: primaryVRChat?.vrchatUsername || '',
        vrchatAlts: (banCase.vrchatAccounts || []).slice(1).map((account: any) => ({
          vrchatUserId: account.vrchatUserId || '',
          vrchatUsername: account.vrchatUsername || '',
        })),
      });
    }
  }

  if (!user && targetQuery.startsWith('usr_')) {
    const report = await Report.findOne({
      $or: [
        { vrchatAccount: targetQuery },
        { vrchatAccount: new RegExp(targetQuery, 'i') },
      ],
    }).lean();
    if (report?.targetUserId) user = await User.findOne({ id: report.targetUserId });
  }

  return { user, banCase, cleaned: targetQuery };
}