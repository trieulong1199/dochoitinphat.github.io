import { larkClient, LARK_CONFIG, USER_FIELDS, listAllRecords } from './client'

export interface LarkUser {
  recordId: string
  username: string
  password: string    // bcrypt hash
  companyName: string
  phone?: string
  isActive: boolean
}

function parseUser(record: { record_id: string; fields: Record<string, unknown> }): LarkUser {
  const f = record.fields
  return {
    recordId: record.record_id,
    username: String(f[USER_FIELDS.USERNAME] ?? ''),
    password: String(f[USER_FIELDS.PASSWORD] ?? ''),
    companyName: String(f[USER_FIELDS.COMPANY_NAME] ?? ''),
    phone: f[USER_FIELDS.PHONE] ? String(f[USER_FIELDS.PHONE]) : undefined,
    isActive: f[USER_FIELDS.IS_ACTIVE] !== false,
  }
}

export async function getUserByUsername(username: string): Promise<LarkUser | null> {
  try {
    const records = await listAllRecords(LARK_CONFIG.tables.users, {
      filter: `CurrentValue.[${USER_FIELDS.USERNAME}]="${username}"`,
      pageSize: 1,
    })
    if (records.length === 0) return null
    return parseUser(records[0])
  } catch {
    return null
  }
}

export async function getUserById(recordId: string): Promise<LarkUser | null> {
  try {
    const res = await larkClient.bitable.appTableRecord.get({
      path: {
        app_token: LARK_CONFIG.appToken,
        table_id: LARK_CONFIG.tables.users,
        record_id: recordId,
      },
    })
    if (!res.data?.record) return null
    return parseUser({
      record_id: recordId,
      fields: (res.data.record.fields as Record<string, unknown>) ?? {},
    })
  } catch {
    return null
  }
}

export async function createUser(data: {
  username: string
  password: string  // should be bcrypt hash
  companyName: string
  phone?: string
}): Promise<LarkUser> {
  const res = await larkClient.bitable.appTableRecord.create({
    path: {
      app_token: LARK_CONFIG.appToken,
      table_id: LARK_CONFIG.tables.users,
    },
    data: {
      fields: {
        [USER_FIELDS.USERNAME]: data.username,
        [USER_FIELDS.PASSWORD]: data.password,
        [USER_FIELDS.COMPANY_NAME]: data.companyName,
        [USER_FIELDS.PHONE]: data.phone ?? '',
        [USER_FIELDS.IS_ACTIVE]: true,
      },
    },
  })

  const record = res.data?.record
  if (!record) {
    throw new Error(`Lark create user failed: ${JSON.stringify(res)}`)
  }
  return parseUser({
    record_id: record.record_id!,
    fields: (record.fields as Record<string, unknown>) ?? {},
  })
}
