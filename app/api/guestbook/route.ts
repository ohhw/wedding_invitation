import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const databaseId = process.env.NOTION_DATABASE_ID

export async function POST(request: NextRequest) {
  try {
    const { name, message } = await request.json()

    if (!name || !message) {
      return NextResponse.json({ error: '이름과 메시지는 필수입니다.' }, { status: 400 })
    }

    if (!databaseId) {
      return NextResponse.json({ error: '노션 데이터베이스 ID가 설정되지 않았습니다.' }, { status: 500 })
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        이름: {
          title: [
            {
              text: { content: name },
            },
          ],
        },
        메시지: {
          rich_text: [
            {
              text: { content: message },
            },
          ],
        },
      },
    })

    return NextResponse.json({ success: true, pageId: response.id }, { status: 201 })
  } catch (error) {
    console.error('노션 API 오류:', error)
    return NextResponse.json({ error: '메시지를 저장하는 중에 오류가 발생했습니다.' }, { status: 500 })
  }
}

type NotionTextItem = {
  plain_text?: string
  text?: {
    content?: string
  }
}

type NotionPageResult = {
  id: string
  properties: Record<
    string,
    {
      title?: NotionTextItem[]
      rich_text?: NotionTextItem[]
    }
  >
}

export async function GET() {
  try {
    if (!databaseId) {
      return NextResponse.json({ error: '노션 데이터베이스 ID가 설정되지 않았습니다.' }, { status: 500 })
    }

    const database = await notion.databases.retrieve({ database_id: databaseId })
    const dataSourceId = (database as unknown as { data_sources?: Array<{ id: string }> }).data_sources?.[0]?.id

    if (!dataSourceId) {
      return NextResponse.json(
        { error: '데이터 소스를 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    const response = await notion.request<{
      results: NotionPageResult[]
    }>({
      path: `data_sources/${dataSourceId}/query`,
      method: 'post',
      body: {
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending',
          },
        ],
      },
    })

    const pages = response.results

    const messages = pages.map((page) => {
      const nameProperty = page.properties['이름'] ?? page.properties['Name']
      const messageProperty = page.properties['메시지'] ?? page.properties['Message']

      const name =
        nameProperty?.title?.[0]?.plain_text ??
        nameProperty?.title?.[0]?.text?.content ??
        ''

      const message =
        messageProperty?.rich_text?.[0]?.plain_text ??
        messageProperty?.rich_text?.[0]?.text?.content ??
        ''

      return {
        id: page.id,
        name,
        message,
      }
    })

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error('노션 방명록 조회 오류:', error)
    return NextResponse.json(
      { error: '방명록을 가져오는 중에 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
