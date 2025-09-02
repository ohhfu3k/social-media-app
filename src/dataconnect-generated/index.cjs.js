const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'onlysocial',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createPostRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePost');
}
createPostRef.operationName = 'CreatePost';
exports.createPostRef = createPostRef;

exports.createPost = function createPost(dc) {
  return executeMutation(createPostRef(dc));
};

const getMyPostsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyPosts');
}
getMyPostsRef.operationName = 'GetMyPosts';
exports.getMyPostsRef = getMyPostsRef;

exports.getMyPosts = function getMyPosts(dc) {
  return executeQuery(getMyPostsRef(dc));
};

const followUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'FollowUser', inputVars);
}
followUserRef.operationName = 'FollowUser';
exports.followUserRef = followUserRef;

exports.followUser = function followUser(dcOrVars, vars) {
  return executeMutation(followUserRef(dcOrVars, vars));
};

const listFollowersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFollowers');
}
listFollowersRef.operationName = 'ListFollowers';
exports.listFollowersRef = listFollowersRef;

exports.listFollowers = function listFollowers(dc) {
  return executeQuery(listFollowersRef(dc));
};
