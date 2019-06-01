const app = require('../../main/server');

// Configure chai
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
chai.should();
const assert = chai.assert;

const sinon = require("sinon");
const execute = require("../../main/utils/execute")

const {
    payload,
    header
} = require("../datas/github-not-jenkins-push-event");

const githubUtil = require("../../main/utils/github");

describe("GitHub hooks", () => {

    let methodStubbed = null;
    beforeEach(function () {
        sinon.stub(execute, "exec");
        methodStubbed = execute.exec;
    })

    afterEach(function () {
        sinon.restore()
    })


    describe("POST /not-jenkins", () => {
        it("should call execute with right variable", (done) => {

            sinon.spy(githubUtil, "isReqFromGithub");
            sinon.spy(githubUtil, "validGithubSecret");
            sinon.spy(githubUtil, "isCommitFromBranch");

            const request = chai.request(app)
                .post('/not-jenkins');

            Object.keys(header).forEach(key => {
                request.set(key, header[key]);
            });

            request.send(JSON.stringify(payload))
                .end((err, res) => {

                    res.should.have.status(200);

                    assert.equal(methodStubbed.callCount, 4, "expect execute to be called 4 times, clone, build, deploy, cleanup");

                    let expected = `REPO_URL="git@github.com:Maxthod/not-jenkins.git" WORKDDIR="thehempathy_not_jenkins" not-jenkins-clone`
                    assert.equal(methodStubbed.getCall(0).args[0], expected, "Param in execute wrong");

                    expected = `IMAGE_NAME=thehempathy-not-jenkins:latest WORKDDIR=thehempathy_not_jenkins not-jenkins-build`;
                    assert.equal(methodStubbed.getCall(1).args[0], expected, "Param in execute wrong");


                    expected = `IMAGE_NAME=thehempathy-not-jenkins:latest SERVICE_NAME=not_jenkins not-jenkins-deploy`
                    assert.equal(methodStubbed.getCall(2).args[0], expected, "Param in execute wrong");

                    expected = `WORKDDIR="thehempathy_not_jenkins" not-jenkins-cleanup`
                    assert.equal(methodStubbed.getCall(3).args[0], expected, "Param in execute wrong");



                    done();
                });
        });

    });
});