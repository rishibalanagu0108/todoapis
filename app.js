const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
  }
}

initializeDbAndServer()

//API 1

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getQueryData = ''
  const {search_q = '', status, priority} = request.query

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getQueryData = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`
      break

    case hasPriorityProperty(request.query):
      getQueryData = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getQueryData = `
    SELECT * FROM todo 
    WHERE todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getQueryData = `
    SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%';`
  }

  data = await db.all(getQueryData)
  response.send(data)
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoItemQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`

  const getTodoItem = await db.get(getTodoItemQuery)
  response.send(getTodoItem)
})

//API 3

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const postTodoQuery = `
  INSERT INTO todo(id, todo, priority, status)
  VALUES (${id},'${todo}','${priority}','${status}');`

  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

//API 4

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  console.log(todoId)
  const requestBody = request.body
  let updatedColumn = ''

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = 'Status'
      break

    case requestBody.priority !== undefined:
      updatedColumn = 'Priority'
      break

    case requestBody.todo !== undefined:
      updatedColumn = 'Todo'
      break
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`

  const previousTodo = await db.get(previousTodoQuery)
  console.log(previousTodo)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
  UPDATE todo SET 
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}';`

  const updateTodo = await db.run(updateTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

//API 5

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
  DELETE FROM todo WHERE id = ${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
