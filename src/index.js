const { request } = require("express");
const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();

const customers = [];

app.use(express.json());

const verifyIfExistsAccount = (request, response, next) => {
	const { headers: { cpf } } = request;

	const customer = customers.find((customer) => customer.cpf === cpf);

	if (!customer){
		return response.status(400).send({ error: "Customer not exists!" });
	}

	request.customer = customer;

	return next();
};

const getBalance = (statement) => {
	const balance = statement.reduce((acc, operation) => {
		return acc + (operation.amount * (operation.type === "credit" ? 1 : -1));
	}, 0);

	return balance;
};

app.get("/api/account", verifyIfExistsAccount, (request, response) => {
	const { customer } = request;

	return response.send(customer);
});

app.post("/api/account", (request, response) => {
	const { body: { cpf, name } } = request;

	const customersAlreadyExists = customers.some((customer) => customer.cpf === cpf);

	if (customersAlreadyExists){
		return response.status(400).send({ error: "Customer already exists!" });
	}

	customers.push({
		id: uuidV4(),
		cpf,
		name,
		statement: []
	})

	return response.status(201).send(customers);
});

app.put("/api/account", verifyIfExistsAccount, (request, response) => {
	const { body: { name }, customer } = request;

	customer.name = name;

	return response.status(201).send();
});

app.delete("/api/account", verifyIfExistsAccount, (request, response) => {
	const { customer } = request;

	customers.splice(customer, 1)

	return response.status(204).send();
});

app.get("/api/statement", verifyIfExistsAccount, (request, response) => {
	const { customer } = request;

	return response.json(customer.statement);
});

app.get("/api/statement/date", verifyIfExistsAccount, (request, response) => {
	const { customer: { statement }, query: { date } } = request;

	const dateFormat = new Date(date + " 00:00");

	const statementFilter = statement.filter((register) => register.created_at.toDateString() === new Date(dateFormat).toDateString());

	return response.json(statementFilter);
});

app.get("/api/balance", verifyIfExistsAccount, (request, response) => {
	const { customer: { statement } } = request;

	const balance = getBalance(statement);

	return response.json(balance);
});

app.post("/api/deposit", verifyIfExistsAccount, (request, response) => {
	const { customer: { statement }, body: { description, amount } } = request;

	statement.push({
		description,
		amount,
		created_at: new Date(),
		type: "credit"
	});

	return response.status(201).send();
});

app.post("/api/withdraw", verifyIfExistsAccount, (request, response) => {
	const { customer: { statement }, body: { amount } } = request;

	const balance = getBalance(statement);

	if (balance < amount){
		return response.status(400).json({error: "Insufficient funds!"});
	}

	statement.push({
		amount,
		created_at: new Date(),
		type: "debit"
	});

	return response.status(201).send();
});

app.listen(3333);