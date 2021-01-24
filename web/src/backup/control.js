const fs = require('fs');

async function getBackups() {
  const names = fs.readdirSync(process.env.BACKUP_PATH);
  return names.map(name => ({ name }));
};

module.exports = {
  getBackups
}
