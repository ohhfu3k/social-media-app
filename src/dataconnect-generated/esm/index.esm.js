import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'onlysocial',
  location: 'us-central1'
};

export const createPostRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePost');
}
createPostRef.operationName = 'CreatePost';

export function createPost(dc) {
  return executeMutation(createPostRef(dc));
}

export const getMyPostsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyPosts');
}
getMyPostsRef.operationName = 'GetMyPosts';

export function getMyPosts(dc) {
  return executeQuery(getMyPostsRef(dc));
}

export const followUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'FollowUser', inputVars);
}
followUserRef.operationName = 'FollowUser';

export function followUser(dcOrVars, vars) {
  return executeMutation(followUserRef(dcOrVars, vars));
}

export const listFollowersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFollowers');
}
listFollowersRef.operationName = 'ListFollowers';

export function listFollowers(dc) {
  return executeQuery(listFollowersRef(dc));
}

