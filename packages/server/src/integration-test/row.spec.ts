import { faker } from "@faker-js/faker"
import {
  generateMakeRequest,
  MakeRequestResponse,
} from "../api/routes/public/tests/utils"

import * as setup from "../api/routes/tests/utilities"
import { Datasource, FieldType, SourceName, Table } from "@budibase/types"

const config = setup.getConfig()
let apiKey,
  makeRequest: MakeRequestResponse,
  postgresDatasource: Datasource,
  postgresTable: Table

beforeEach(async () => {
  await config.init()
  apiKey = await config.generateApiKey()
  postgresDatasource = await config.createDatasource({
    type: "datasource",
    source: SourceName.POSTGRES,
    plus: true,
    config: {
      host: "192.168.1.98",
      port: 54321,
      database: "postgres",
      user: "root",
      password: "root",
      schema: "public",
      ssl: false,
      rejectUnauthorized: false,
      ca: false,
    },
  })

  makeRequest = generateMakeRequest(apiKey)

  postgresTable = await config.createTable({
    name: faker.lorem.word(),
    schema: {
      name: {
        name: "name",
        type: FieldType.STRING,
        constraints: {
          presence: true,
        },
      },
      description: {
        name: "description",
        type: FieldType.STRING,
      },
      value: {
        name: "value",
        type: FieldType.NUMBER,
      },
    },
    sourceId: postgresDatasource._id,
  })
})

afterAll(async () => {
  await config.end()
})

function createRandomRow() {
  return {
    name: faker.name.fullName(),
    description: faker.lorem.paragraphs(),
    value: +faker.random.numeric(),
  }
}

describe("row api", () => {
  describe("create a row", () => {
    test("Given than no row exists, adding a new rows persists it", async () => {
      const newRow = createRandomRow()

      const res = await makeRequest(
        "post",
        `/tables/${postgresTable._id}/rows`,
        newRow
      )

      expect(res.status).toBe(200)

      const persistedRows = await config.getRows(postgresTable._id!)
      expect(persistedRows).toHaveLength(1)
      expect(persistedRows).toEqual([
        expect.objectContaining({
          ...res.body.data,
          ...newRow,
        }),
      ])
    })

    test("Given than no row exists, multiple rows can be persisted", async () => {
      const numberOfRows = 10
      const newRows = Array(numberOfRows).fill(createRandomRow())

      for (const newRow of newRows) {
        const res = await makeRequest(
          "post",
          `/tables/${postgresTable._id}/rows`,
          newRow
        )
        expect(res.status).toBe(200)
      }

      const persistedRows = await config.getRows(postgresTable._id!)
      expect(persistedRows).toHaveLength(numberOfRows)
      expect(persistedRows).toEqual(
        expect.arrayContaining(newRows.map(expect.objectContaining))
      )
    })
  })

  describe("Retrieve a row", () => {
    test("Given than a table have a single row, the row can be retrieved successfully", async () => {
      const rowData = createRandomRow()
      const row = await config.createRow(rowData)

      const res = await makeRequest(
        "get",
        `/tables/${postgresTable._id}/rows/${row._id}`
      )

      expect(res.status).toBe(200)

      expect(res.body.data).toEqual(expect.objectContaining(rowData))
    })

    test("Given than a table have a multiple rows, a single row can be retrieved successfully", async () => {
      await Promise.all(Array(5).map(() => config.createRow(createRandomRow())))
      const rowData = createRandomRow()
      const row = await config.createRow(rowData)
      await Promise.all(Array(2).map(() => config.createRow(createRandomRow())))

      const res = await makeRequest(
        "get",
        `/tables/${postgresTable._id}/rows/${row._id}`
      )

      expect(res.status).toBe(200)

      expect(res.body.data).toEqual(expect.objectContaining(rowData))
    })
  })
})
