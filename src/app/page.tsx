'use client'
import { MessageResponse } from '@/interface/response'
import { useSocketApi } from '@/lib/socketapi'
import { ChatMessage } from 'chatgpt'
import { useRef, useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import setupIndexedDB, { useIndexedDBStore } from 'use-indexeddb'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const dbConfig = {
  databaseName: 'chatgpt',
  version: 1,
  stores: [
    {
      name: 'message',
      id: { keyPath: 'id', autoIncrement: false },
      indices: [
        {
          name: 'id',
          keyPath: 'id',
          options: { unique: true },
        },
        {
          name: 'text',
          keyPath: 'text',
          options: { unique: false },
        },
        {
          name: 'role',
          keyPath: 'role',
          options: { unique: false },
        },
        {
          name: 'parentMessageId',
          keyPath: 'parentMessageId',
          options: { unique: false },
        },
        {
          name: 'conversationId',
          keyPath: 'conversationId',
          options: { unique: false },
        },
      ],
    },
  ],
}

export default function Home() {
  const editableRef = useRef<HTMLInputElement>(null)

  const [lock, setLock] = useState(false)

  const { messages, send, latest, init, initializing, reset } = useSocketApi()

  const [message, setMessage] = useState('')

  const handleSend = async () => {
    const payload = latest
      ? {
          parentMessageId: latest.data.id,
          conversationId: latest.data.conversationId,
          message,
        }
      : { message }

    send(payload)

    setLock(true)

    editableRef.current!.textContent = ''
  }

  const { add, getByID, getAll, deleteAll } = useIndexedDBStore<{ id: string } & MessageResponse<ChatMessage>>(
    'message'
  )

  const upsert = useCallback(
    async (value: MessageResponse<ChatMessage>) => {
      if (value.completed) {
        const id = value.data.id
        if (await getByID(value.data.id)) {
          // do noting
        } else {
          add({ id, ...value })
        }
      }
    },
    [add, getByID]
  )

  const initFromDb = async () => {
    await setupIndexedDB(dbConfig)
    const allData = (await getAll()).map(({ id, ...rest }) => rest)
    init(allData)
  }

  const clearHistory = () => {
    reset()
    deleteAll()
  }

  useEffect(() => {
    if (latest && !initializing) {
      setLock(false)
      document.querySelector(`#${latest.data.id}`)?.scrollIntoView({ behavior: 'smooth' })
      upsert(latest)
    }
  }, [initializing, latest, upsert])

  useEffect(() => {
    initFromDb()
  }, [])

  const [theme, setTheme] = useState('dark')
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark')
    document.querySelector('html')?.classList.add(theme === 'dark' ? 'light' : 'dark')
    document.querySelector('html')?.classList.remove(theme === 'dark' ? 'dark' : 'light')
  }, [theme])

  return (
    <main className="max-h-full min-h-full flex flex-col">
      <div className='h-10 px-4 flex items-center'>
        <input type="checkbox" className="toggle toggle-xs ml-auto" checked={theme === 'dark'} onClick={toggleTheme} />
      </div>
      <section className="px-4 pt-0 flex-1 overflow-hidden flex">
        <ul className="mockup-window bg-stone-100 dark:bg-base-300 w-full">
          {messages.map(([id, message]) => {
            return (
              <li className="border-b-[1px]" id={id} key={id}>
                <div className="p-3 bg-stone-100 dark:bg-zinc-700">{message.send}</div>
                <ReactMarkdown
                  className="p-3"
                  rehypePlugins={[rehypeHighlight]}
                  remarkPlugins={[remarkGfm]}
                  // eslint-disable-next-line react/no-children-prop
                  children={message.data.text}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          // eslint-disable-next-line react/no-children-prop
                          children={String(children).replace(/\n$/, '')}
                          style={dark as any}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                />
              </li>
            )
          })}
        </ul>
      </section>
      <section className="w-full px-4 pb-10 mt-4 flex flex-wrap md:gap-4 gap-1">
        <input
          disabled={lock}
          role="textbox"
          aria-disabled={lock}
          className="input input-bordered flex-1"
          suppressContentEditableWarning
          ref={editableRef}
          onInput={(evt) => setMessage(evt.currentTarget.innerText ?? '')}
        />

        <button className="btn btn-active btn-accent md:w-24" disabled={lock}>
          发送
        </button>
        <button onClick={clearHistory} className="btn btn-error md:w-24 hidden sm:block">
          清除历史
        </button>
        <button onClick={clearHistory} className="btn btn-error w-full block sm:hidden">
          清除历史
        </button>
      </section>
    </main>
  )
}
