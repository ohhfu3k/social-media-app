import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreatePostData {
  post_insert: Post_Key;
}

export interface FollowUserData {
  follow_insert: Follow_Key;
}

export interface FollowUserVariables {
  followingId: UUIDString;
}

export interface Follow_Key {
  followerId: UUIDString;
  followingId: UUIDString;
  __typename?: 'Follow_Key';
}

export interface GetMyPostsData {
  posts: ({
    id: UUIDString;
    contentUrl: string;
    caption?: string | null;
  } & Post_Key)[];
}

export interface Like_Key {
  userId: UUIDString;
  postId: UUIDString;
  __typename?: 'Like_Key';
}

export interface ListFollowersData {
  follows: ({
    follower: {
      id: UUIDString;
      username: string;
    } & User_Key;
  })[];
}

export interface Post_Key {
  id: UUIDString;
  __typename?: 'Post_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreatePostRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreatePostData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreatePostData, undefined>;
  operationName: string;
}
export const createPostRef: CreatePostRef;

export function createPost(): MutationPromise<CreatePostData, undefined>;
export function createPost(dc: DataConnect): MutationPromise<CreatePostData, undefined>;

interface GetMyPostsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyPostsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyPostsData, undefined>;
  operationName: string;
}
export const getMyPostsRef: GetMyPostsRef;

export function getMyPosts(): QueryPromise<GetMyPostsData, undefined>;
export function getMyPosts(dc: DataConnect): QueryPromise<GetMyPostsData, undefined>;

interface FollowUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: FollowUserVariables): MutationRef<FollowUserData, FollowUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: FollowUserVariables): MutationRef<FollowUserData, FollowUserVariables>;
  operationName: string;
}
export const followUserRef: FollowUserRef;

export function followUser(vars: FollowUserVariables): MutationPromise<FollowUserData, FollowUserVariables>;
export function followUser(dc: DataConnect, vars: FollowUserVariables): MutationPromise<FollowUserData, FollowUserVariables>;

interface ListFollowersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFollowersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListFollowersData, undefined>;
  operationName: string;
}
export const listFollowersRef: ListFollowersRef;

export function listFollowers(): QueryPromise<ListFollowersData, undefined>;
export function listFollowers(dc: DataConnect): QueryPromise<ListFollowersData, undefined>;

