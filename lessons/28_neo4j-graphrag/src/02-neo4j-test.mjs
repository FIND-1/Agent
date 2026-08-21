import neo4j from 'neo4j-driver'

// 这个示例对应文章里“先用代码连接 Neo4j，再执行最基础的增删改查”。
// 适合复习 driver / session / session.run 的最小调用链。
// 依赖条件：本地需要可连接的 Neo4j Bolt 服务；当前仓库本轮只做静态整理，没有实际连库验证。

// 连接信息（和你的 docker-compose 完全一致）
const driver = neo4j.driver(
'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', '12345678')
)

// 1. 执行创建节点（示例）
async function createData(session) {
  await session.run(`
    CREATE (p:Product {name: "珍珠奶茶"})
    CREATE (i:Ingredient {name: "珍珠"})
  `)
  console.log('创建成功')
}

// 2. 执行创建关系（示例）
async function createRelation(session) {
  await session.run(`
    MATCH (p:Product {name: "珍珠奶茶"}), (i:Ingredient {name: "珍珠"})
    CREATE (p)-[:包含]->(i)
  `)
  console.log('关系创建成功')
}

// 3. 查询数据
async function queryData(session) {
  const result = await session.run(`
    MATCH (p:Product {name: "珍珠奶茶"})-[r]->(i)
    RETURN p, r, i
  `)

  result.records.forEach(record => {
    console.log('奶茶:', record.get('p').properties.name)
    console.log('关系:', record.get('r').type)
    console.log('配料:', record.get('i').properties.name)
    console.log('--------------------------------')
  })
}

// 4. 更新属性
async function updateData(session) {
  await session.run(`
    MATCH (p:Product {name: "珍珠奶茶"})
    SET p.price = 15, p.calorie = "中高"
  `)
  console.log('更新成功')
}

// 5. 删除关系
async function deleteRelation(session) {
  await session.run(`
    MATCH (p:Product {name: "珍珠奶茶"})-[r:包含]->(i:Ingredient {name: "珍珠"})
    DELETE r
  `)
  console.log('删除关系成功')
}

// 6. 删除节点
async function deleteNode(session) {
  await session.run(`
    MATCH (p:Product {name: "珍珠奶茶"})
    DELETE p
  `)
  console.log('删除节点成功')
}

async function main() {
  // 获取会话
  const session = driver.session()

  try {
    // 执行（你想运行哪个就打开哪个）
    // await createData(session)
    // await createRelation(session)
    await queryData(session)
    // await updateData(session)
    // await deleteRelation(session)
    // await deleteNode(session)
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(error => {
  console.error('Neo4j 示例执行失败：', error.message)
  process.exitCode = 1
})
