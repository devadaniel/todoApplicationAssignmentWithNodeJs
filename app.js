const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, isMatch } = require("date-fns");
const { isValid } = require("date-fns");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// scenario 1
const hasStatusProp = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// scenario2
const hasPriorityProp = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

// scenario 3
const hasPriorityAndStatusProp = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

// scenario 4
const hasSearchQProp = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

// scenario 5
const hasCategoryAndStatusProp = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

// scenario 6
const hasCategoryProp = (requestQuery) => {
  return requestQuery.category !== undefined;
};

// scenario 7
const hasCategoryAndPriorityProp = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getRequestQueryResult = "";
  const { search_q = "", todo, priority, category, status } = request.query;

  switch (true) {
    // scenario 1
    case hasStatusProp(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getRequestQueryResult = `
             SELECT * FROM todo WHERE status = '${status}' 
            `;
        data = await db.all(getRequestQueryResult);
        response.send(data.map((eachItem) => convertDbObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // scenario 2
    case hasPriorityProp(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getRequestQueryResult = `SELECT * FROM todo WHERE priority = '${priority}'`;
        data = await db.all(getRequestQueryResult);
        response.send(data.map((eachItem) => convertDbObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    // scenario 3
    case hasPriorityAndStatusProp(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getRequestQueryResult = `
            SELECT 
              *
            FROM 
              todo
            WHERE 
              priority = '${priority}'
              AND status = '${status}'
        `;
          data = await db.all(getRequestQueryResult);
          response.send(data.map((eachItem) => convertDbObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // scenario 4
    case hasSearchQProp(request.query):
      getRequestQueryResult = `
        SELECT 
          *
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
        `;
      data = await db.all(getRequestQueryResult);
      response.send(data.map((eachItem) => convertDbObject(eachItem)));
      break;

    // scenario 5
    case hasCategoryAndStatusProp(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getRequestQueryResult = `
        SELECT 
          *
        FROM 
          todo
        WHERE 
          category = '${category}'
          AND status = '${status}'
        `;
          data = await db.all(getRequestQueryResult);
          response.send(data.map((eachItem) => convertDbObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    // scenario 6
    case hasCategoryProp(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getRequestQueryResult = `
        SELECT 
          *
        FROM 
          todo
        WHERE 
          category = '${category}'
        `;
        data = await db.all(getRequestQueryResult);
        response.send(data.map((eachItem) => convertDbObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // scenario 7
    case hasCategoryAndPriorityProp(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getRequestQueryResult = `
        SELECT 
          *
        FROM 
          todo
        WHERE 
          category = '${category}'
          AND priority = '${priority}'
        `;
          data = await db.all(getRequestQueryResult);
          response.send(data.map((eachItem) => convertDbObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getRequestQueryResult = `SELECT * FROM todo`;
      data = await db.all(getRequestQueryResult);
      response.send(data.map((eachItem) => convertDbObject(eachItem)));
      break;
  }
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
     * 
    FROM 
      todo
    WHERE 
      id = ${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  response.send(convertDbObject(todo));
});

// API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isMatchDate = isMatch(date, "yyyy-MM-dd");
  if (isMatchDate) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
      SELECT 
        * 
      FROM 
        todo 
      WHERE 
        due_date = '${newDate}';
      `;
    const dateTodoResult = await db.all(getTodoQuery);
    response.send(dateTodoResult.map((eachItem) => convertDbObject(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const isMatchDate = isMatch(dueDate, "yyyy-MM-dd");
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatchDate) {
          const newPostDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createNewTodo = `
                 INSERT INTO 
                        todo(id, todo, category, priority, status, due_date)
                 VALUES
                      (
                        ${id},
                        '${todo}',
                        '${category}',
                        '${priority}',
                        '${status}',
                        '${newPostDate}'
                      );
                `;
          await db.run(createNewTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";
  const requestBody = request.body;

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
              UPDATE 
                 todo 
              SET 
                 todo='${todo}',
                 category='${category}',
                 priority = '${priority}',
                 status = '${status}',
                 due_date = '${dueDate}'
              WHERE 
                 id=${todoId}
            `;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
              UPDATE 
                 todo 
              SET 
                 todo='${todo}',
                 category='${category}',
                 priority = '${priority}',
                 status = '${status}',
                 due_date = '${dueDate}'
              WHERE 
                 id=${todoId}
            `;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
              UPDATE 
                 todo 
              SET 
                 todo='${todo}',
                 category='${category}',
                 priority = '${priority}',
                 status = '${status}',
                 due_date = '${dueDate}'
              WHERE 
                 id=${todoId}
            `;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
              UPDATE 
                 todo 
              SET 
                 todo='${todo}',
                 category='${category}',
                 priority = '${priority}',
                 status = '${status}',
                 due_date = '${dueDate}'
              WHERE 
                 id=${todoId}
            `;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");

    case requestBody.dueDate !== undefined:
      const isMatchDate = isMatch(dueDate, "yyyy-MM-dd");

      if (isMatchDate) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
            UPDATE 
              todo
            SET 
                 todo='${todo}',
                 category='${category}',
                 priority = '${priority}',
                 status = '${status}',
                 due_date = '${newDueDate}'
            WHERE
              id = ${todoId};
            `;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      break;
  }
});

// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
