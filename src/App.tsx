import { useState, useRef } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'
import { Input, Button, Flex, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Select } from '@chakra-ui/react'

function App() {
  const [loaded, setLoaded] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoFile, setVideoFile] = useState<File>()
  const [outputFormat, setOutputFormat] = useState('')
  const ffmpegRef = useRef<FFmpeg | null>(null)
  if (ffmpegRef.current === null) {
    ffmpegRef.current = new FFmpeg()
  }
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const messageRef = useRef<HTMLParagraphElement | null>(null)
  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
    const ffmpeg = ffmpegRef.current
    ffmpeg?.on('log', ({ type, message }) => {
      console.log(type)
      if (messageRef.current) messageRef.current.innerHTML = message
    })
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg?.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    })
    setLoaded(true)
  }
  const transcode = async () => {
    const videoBlob = videoFile
    const ffmpeg = ffmpegRef.current
    await ffmpeg?.writeFile(`${videoBlob?.name}`, await fetchFile(videoBlob))
    await ffmpeg?.exec(['-i', `${videoBlob?.name}`, '-c:v', 'libx264', '-vf', 'vflip, scale=720:480', '-c:a', 'copy', 'output.mp4'], 100000)
    const fileData = await ffmpeg?.readFile('output.mp4')
    const data = new Uint8Array(fileData as ArrayBuffer)
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
    }
  }
  const videoUploadHandler = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0])
      console.log(e.target.files)
      const arrBuffer = await e.target.files[0].arrayBuffer()
      const data = new Uint8Array(arrBuffer)
      const url = URL.createObjectURL(new Blob([data.buffer], { type: e.target.files[0].type }))
      console.log(url)
      setVideoUrl(url)
    }
  }

  return loaded ? (
    <Flex flexDir={'column'} gap={5} p={2} w={'100dvw'} h={'100dvh'}>
      <Box position={'absolute'} bottom={0} right={0}>
        <p ref={messageRef}></p>
      </Box>
      <Flex flexDir={'column'} gap={2}>
        <Input type='file' onChange={videoUploadHandler} />
        <Accordion defaultIndex={[0]} allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as='span' flex='1' textAlign='left'>
                  ffmpeg config
                </Box>

                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}></AccordionPanel>
          </AccordionItem>
        </Accordion>
        <Button onClick={transcode}>Transcode avi to mp4</Button>
      </Flex>
      <Flex>{<video src={videoUrl}></video>}</Flex>
    </Flex>
  ) : (
    <Button onClick={load}>Load ffmpeg-core</Button>
  )
}

export default App
