const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src');
const should = chai.should();
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

chai.use(chaiHttp);

describe('Backup', () => {

  describe('GET backup', () => {

    it('should list backups', async () => {
      const basePath = process.env.BACKUP_PATH;
      const names = ['abc', '123', 'drm'];
      const dirs = names.map(name => path.join(basePath, name));
      dirs.forEach(dir => fs.mkdirSync(dir));

      const backups = names.map(name => ({name}));
      const res = await chai.request(app).get('/backup');
      expect(res.body.backups).to.have.deep.members(backups);

      dirs.forEach(dir => fs.rmdirSync(dir));
    });

  });

});
