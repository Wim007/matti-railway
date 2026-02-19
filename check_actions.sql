SELECT id, userId, themeId, status, actionText, createdAt, completedAt 
FROM actions 
ORDER BY createdAt DESC 
LIMIT 10;
