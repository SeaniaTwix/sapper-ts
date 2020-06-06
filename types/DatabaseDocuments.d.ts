type ADocument<T extends Object> = {
  _key: string
  _id: string
  _rev: string
} & T

interface DocumentUser {
  username?: string
  password?: string // hashed
}
