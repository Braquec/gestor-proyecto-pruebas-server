
# Firebase Express Task Management API

![Firebase](https://img.shields.io/badge/firebase-Firestore-yellow?logo=firebase) ![Node.js](https://img.shields.io/badge/node.js-18-green?logo=node.js) ![Express.js](https://img.shields.io/badge/express.js-4.19-lightgrey?logo=express) ![License](https://img.shields.io/badge/license-MIT-brightgreen)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://shields.io/)
[![Last Commit](https://img.shields.io/github/last-commit/DanteLans/atomChallenge)](https://shields.io/)
[![Issues](https://img.shields.io/github/issues/DanteLans/atomChallenge)](https://shields.io/)

This project is a task management API built using **Firebase** and **Express.js**. It allows users to create, update, delete, and fetch tasks stored in **Firestore**. The API also handles user data and includes basic validation using **Joi**.

## Features

- **User Management**: Create and retrieve users.
- **Task Management**: Create, update, delete, and list tasks.
- **Validation**: Input validation with **Joi** for tasks and users.
- **Error Handling**: Centralized error handling for common errors.
- **Firebase Firestore**: Firestore is used as the database to store user and task data.

## Endpoints

### Users

- **GET /users/:email**  
  Retrieves user information based on the email provided.

- **POST /users**  
  Creates a new user.  
  **Body Example**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Tasks

- **GET /tasks/:taskId**  
  Fetches a task based on the task ID.

- **GET /tasks**  
  Retrieves all tasks, ordered by the creation date.

- **POST /tasks**  
  Creates a new task.  
  **Body Example**:
  ```json
  {
    "user": "user@example.com",
    "title": "Task Title",
    "description": "Task Description",
    "status": "open"
  }
  ```

- **PUT /tasks/:taskId**  
  Updates an existing task.  
  **Body Example**:
  ```json
  {
    "user": "user@example.com",
    "title": "Updated Title",
    "description": "Updated Description",
    "status": "completed",
    "dateCreated": {
      "_seconds": 1621538537,
      "_nanoseconds": 0
    }
  }
  ```

- **DELETE /tasks/:taskId**  
  Deletes a task by ID.

## Validation

All POST and PUT requests are validated using **Joi** schemas:
- **Task Schema**: Requires `user`, `title`, `description`, and optionally `status`.
- **User Schema**: Requires `email` in a valid format.

## Error Handling

Common errors are handled, including:
- **404**: When a task or user is not found.
- **400**: Validation errors are returned with details.
- **409**: If a document already exists (for example, creating a user with an existing email).
- **500**: General server errors.

