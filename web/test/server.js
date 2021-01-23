const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src');
const should = chai.should();

chai.use(chaiHttp);

describe('Server', () => {

  describe('/GET server/helloworld', () => {

    it('should give us a nice message', async () => {
      const res = await chai.request(app).get('/server/helloworld');
      res.should.have.status(200);
      res.text.should.be.eql('Hello :)');
    });

  });

});
