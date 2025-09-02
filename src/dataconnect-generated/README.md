# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyPosts*](#getmyposts)
  - [*ListFollowers*](#listfollowers)
- [**Mutations**](#mutations)
  - [*CreatePost*](#createpost)
  - [*FollowUser*](#followuser)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyPosts
You can execute the `GetMyPosts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyPosts(): QueryPromise<GetMyPostsData, undefined>;

interface GetMyPostsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyPostsData, undefined>;
}
export const getMyPostsRef: GetMyPostsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyPosts(dc: DataConnect): QueryPromise<GetMyPostsData, undefined>;

interface GetMyPostsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyPostsData, undefined>;
}
export const getMyPostsRef: GetMyPostsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyPostsRef:
```typescript
const name = getMyPostsRef.operationName;
console.log(name);
```

### Variables
The `GetMyPosts` query has no variables.
### Return Type
Recall that executing the `GetMyPosts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyPostsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyPostsData {
  posts: ({
    id: UUIDString;
    contentUrl: string;
    caption?: string | null;
  } & Post_Key)[];
}
```
### Using `GetMyPosts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyPosts } from '@dataconnect/generated';


// Call the `getMyPosts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyPosts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyPosts(dataConnect);

console.log(data.posts);

// Or, you can use the `Promise` API.
getMyPosts().then((response) => {
  const data = response.data;
  console.log(data.posts);
});
```

### Using `GetMyPosts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyPostsRef } from '@dataconnect/generated';


// Call the `getMyPostsRef()` function to get a reference to the query.
const ref = getMyPostsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyPostsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.posts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.posts);
});
```

## ListFollowers
You can execute the `ListFollowers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listFollowers(): QueryPromise<ListFollowersData, undefined>;

interface ListFollowersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFollowersData, undefined>;
}
export const listFollowersRef: ListFollowersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFollowers(dc: DataConnect): QueryPromise<ListFollowersData, undefined>;

interface ListFollowersRef {
  ...
  (dc: DataConnect): QueryRef<ListFollowersData, undefined>;
}
export const listFollowersRef: ListFollowersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFollowersRef:
```typescript
const name = listFollowersRef.operationName;
console.log(name);
```

### Variables
The `ListFollowers` query has no variables.
### Return Type
Recall that executing the `ListFollowers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFollowersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListFollowersData {
  follows: ({
    follower: {
      id: UUIDString;
      username: string;
    } & User_Key;
  })[];
}
```
### Using `ListFollowers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFollowers } from '@dataconnect/generated';


// Call the `listFollowers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFollowers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFollowers(dataConnect);

console.log(data.follows);

// Or, you can use the `Promise` API.
listFollowers().then((response) => {
  const data = response.data;
  console.log(data.follows);
});
```

### Using `ListFollowers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFollowersRef } from '@dataconnect/generated';


// Call the `listFollowersRef()` function to get a reference to the query.
const ref = listFollowersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFollowersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.follows);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.follows);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreatePost
You can execute the `CreatePost` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPost(): MutationPromise<CreatePostData, undefined>;

interface CreatePostRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreatePostData, undefined>;
}
export const createPostRef: CreatePostRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPost(dc: DataConnect): MutationPromise<CreatePostData, undefined>;

interface CreatePostRef {
  ...
  (dc: DataConnect): MutationRef<CreatePostData, undefined>;
}
export const createPostRef: CreatePostRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPostRef:
```typescript
const name = createPostRef.operationName;
console.log(name);
```

### Variables
The `CreatePost` mutation has no variables.
### Return Type
Recall that executing the `CreatePost` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePostData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePostData {
  post_insert: Post_Key;
}
```
### Using `CreatePost`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPost } from '@dataconnect/generated';


// Call the `createPost()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPost();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPost(dataConnect);

console.log(data.post_insert);

// Or, you can use the `Promise` API.
createPost().then((response) => {
  const data = response.data;
  console.log(data.post_insert);
});
```

### Using `CreatePost`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPostRef } from '@dataconnect/generated';


// Call the `createPostRef()` function to get a reference to the mutation.
const ref = createPostRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPostRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.post_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.post_insert);
});
```

## FollowUser
You can execute the `FollowUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
followUser(vars: FollowUserVariables): MutationPromise<FollowUserData, FollowUserVariables>;

interface FollowUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: FollowUserVariables): MutationRef<FollowUserData, FollowUserVariables>;
}
export const followUserRef: FollowUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
followUser(dc: DataConnect, vars: FollowUserVariables): MutationPromise<FollowUserData, FollowUserVariables>;

interface FollowUserRef {
  ...
  (dc: DataConnect, vars: FollowUserVariables): MutationRef<FollowUserData, FollowUserVariables>;
}
export const followUserRef: FollowUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the followUserRef:
```typescript
const name = followUserRef.operationName;
console.log(name);
```

### Variables
The `FollowUser` mutation requires an argument of type `FollowUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface FollowUserVariables {
  followingId: UUIDString;
}
```
### Return Type
Recall that executing the `FollowUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `FollowUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface FollowUserData {
  follow_insert: Follow_Key;
}
```
### Using `FollowUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, followUser, FollowUserVariables } from '@dataconnect/generated';

// The `FollowUser` mutation requires an argument of type `FollowUserVariables`:
const followUserVars: FollowUserVariables = {
  followingId: ..., 
};

// Call the `followUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await followUser(followUserVars);
// Variables can be defined inline as well.
const { data } = await followUser({ followingId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await followUser(dataConnect, followUserVars);

console.log(data.follow_insert);

// Or, you can use the `Promise` API.
followUser(followUserVars).then((response) => {
  const data = response.data;
  console.log(data.follow_insert);
});
```

### Using `FollowUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, followUserRef, FollowUserVariables } from '@dataconnect/generated';

// The `FollowUser` mutation requires an argument of type `FollowUserVariables`:
const followUserVars: FollowUserVariables = {
  followingId: ..., 
};

// Call the `followUserRef()` function to get a reference to the mutation.
const ref = followUserRef(followUserVars);
// Variables can be defined inline as well.
const ref = followUserRef({ followingId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = followUserRef(dataConnect, followUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.follow_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.follow_insert);
});
```

