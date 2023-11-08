import { app } from '../src/app'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'

describe('Transaction routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('pnpm run knex migrate:rollback --all')
    execSync('pnpm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions test',
        amount: 100,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createdTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions test',
        amount: 100,
        type: 'credit',
      })

    const cookies = createdTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transactions test',
        amount: 100,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    const createdTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions test',
        amount: 100,
        type: 'credit',
      })

    const cookies = createdTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transactions test',
        amount: 100,
      }),
    )
  })

  it('should be able to get the transactions summary', async () => {
    const createdTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions test',
        amount: 100,
        type: 'credit',
      })

    const cookies = createdTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 900,
        type: 'debit',
      })

    const listTransactionsResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: -800,
      }),
    )
  })
})
