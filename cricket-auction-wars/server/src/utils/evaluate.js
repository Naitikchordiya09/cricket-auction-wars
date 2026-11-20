function evaluateRoom(room) {
  const teams = room.members.map(member => {
    const players = member.squad || [];
    const count = players.length;
    const avg = key => count ? players.reduce((sum, p) => sum + (p[key] || 0), 0) / count : 0;
    const roleCount = role => players.filter(p => p.role === role).length;
    const overseas = players.filter(p => p.isOverseas).length;
    const batting = avg("batting");
    const bowling = avg("bowling");
    const fielding = avg("fielding");
    const roleBalance = Math.min(100, roleCount("Batter") * 12 + roleCount("Bowler") * 12 + roleCount("All-rounder") * 16 + roleCount("Wicketkeeper") * 20);
    const squadDepth = Math.min(100, count * 10);
    const budgetEfficiency = Math.max(0, Math.min(100, (100 - member.budget) * 1.1));
    const score = Math.round(batting * .25 + bowling * .25 + roleBalance * .15 + fielding * .10 + squadDepth * .10 + budgetEfficiency * .15);
    return {
      userId: String(member.user._id || member.user),
      teamName: member.teamName,
      players: count,
      overseas,
      remainingBudget: Number(member.budget.toFixed(2)),
      score,
      breakdown: { batting: Math.round(batting), bowling: Math.round(bowling), roleBalance, fielding: Math.round(fielding), squadDepth, budgetEfficiency: Math.round(budgetEfficiency) }
    };
  }).sort((a,b) => b.score - a.score);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}
module.exports = evaluateRoom;
