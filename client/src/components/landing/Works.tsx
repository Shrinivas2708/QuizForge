import { FileIcon, Settings, Trophy } from 'lucide-react'

const WorkData = [
  {
    name: 'Upload',
    icon: <FileIcon size={30} />,
    header: 'Upload Your Syllabus',
    desc: 'Drag and drop any PDF or DOC file. Our AI gets to work instantly',
  },
  {
    name: 'Customize',
    icon: <Settings size={30} />,
    header: 'Tailor Your Quiz',
    desc: 'Choose your format multiple choice, true/false, or short answer. Set the difficulty and length',
  },
  {
    name: 'Conquer',
    icon: <Trophy size={30} />,
    header: 'Start Learning',
    desc: 'Take your custom quiz, track your progress with detailed analytics, and master your material.',
  },
]

export default function Works() {
  return (
    <section className="flex flex-col justify-center items-center gap-10 mt-20 font-geist pb-3 px-4">
      <div className="font-bold text-4xl text-center">
        How It <span className="text-primary">Works?</span>
      </div>
      <div className="space-y-8 max-w-2xl w-full">
        {WorkData.map((v, i) => {
          return (
            <div
              key={i}
              className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left"
            >
              <div className="flex-shrink-0 flex flex-col items-center justify-center bg-primary rounded-full w-28 h-28 font-bold text-white dark:text-foreground">
                <div className="text-white dark:text-foreground">{v.icon}</div>
                <p className="text-white dark:text-foreground">{v.name}</p>
              </div>
              <div className="w-full">
                <p className="text-2xl font-bold">{v.header}</p>
                <p className="text-base text-muted-foreground">{v.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}