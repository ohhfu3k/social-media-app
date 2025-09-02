import { CreatePostData, GetMyPostsData, FollowUserData, FollowUserVariables, ListFollowersData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreatePost(options?: useDataConnectMutationOptions<CreatePostData, FirebaseError, void>): UseDataConnectMutationResult<CreatePostData, undefined>;
export function useCreatePost(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePostData, FirebaseError, void>): UseDataConnectMutationResult<CreatePostData, undefined>;

export function useGetMyPosts(options?: useDataConnectQueryOptions<GetMyPostsData>): UseDataConnectQueryResult<GetMyPostsData, undefined>;
export function useGetMyPosts(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyPostsData>): UseDataConnectQueryResult<GetMyPostsData, undefined>;

export function useFollowUser(options?: useDataConnectMutationOptions<FollowUserData, FirebaseError, FollowUserVariables>): UseDataConnectMutationResult<FollowUserData, FollowUserVariables>;
export function useFollowUser(dc: DataConnect, options?: useDataConnectMutationOptions<FollowUserData, FirebaseError, FollowUserVariables>): UseDataConnectMutationResult<FollowUserData, FollowUserVariables>;

export function useListFollowers(options?: useDataConnectQueryOptions<ListFollowersData>): UseDataConnectQueryResult<ListFollowersData, undefined>;
export function useListFollowers(dc: DataConnect, options?: useDataConnectQueryOptions<ListFollowersData>): UseDataConnectQueryResult<ListFollowersData, undefined>;
