const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_hr_directory_db');
const express = require('express');
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM employees;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex);
    }
});

app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM departments;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex);
    }
});

app.post('/api/employees', async (req, res, next) => {
    try {
        const {name, department_id} =req.body;
        const SQL = `
        INSERT INTO employees (name, department_id)
        VALUES($1, $2)
        RETURNING *;
        `;
        const response = await client.query(SQL, [name, department_id]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const {name, department_id} = req.body;
        const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 
        RETURNING *;
        `;
        const response = await client.query(SQL, [ name, department_id, req.params.id]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from employees
        WHERE id = $1;
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
});

app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

const init = async() => {
    await client.connect();
    console.log("connected to database");

    let SQL = `
    CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id)
    );
    `;

await client.query(SQL);
console.log("tables created");

SQL = `
INSERT INTO departments(name) VALUES('HR');
    INSERT INTO departments(name) VALUES('Engineering');
    INSERT INTO departments(name) VALUES('Marketing');

    INSERT INTO employees(name, department_id) VALUES('John Doe', 1);
    INSERT INTO employees(name, department_id) VALUES('Jane Smith', 2);
    INSERT INTO employees(name, department_id) VALUES('Alice Johnson', 3);
    `;

await client.query(SQL);
console.log("data seeded");

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));

};

init();
