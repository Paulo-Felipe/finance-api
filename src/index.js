const { request } = require("express");
const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();

const customers = [];

app.use(express.json());

app.post("/account", (request, response) => {
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

app.get("/statement/:cpf", (request, response) => {
	const { params: { cpf } } = request;

	const customer = customers.find((customer) => customer.cpf === cpf);

	if (!customer){
		return response.status(400).send({ error: "Customer not exists!" });
	}

	return response.json(customer.statement);

});

app.listen(3333);