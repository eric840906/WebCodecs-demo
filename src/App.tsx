import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'
import { Input, Button, Flex, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Select } from '@chakra-ui/react'
import { PlayIcon, PauseIcon } from './assets/Icons'

function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoFile, setVideoFile] = useState<File>()
  const decoderRef = useRef<VideoDecoder | null>(null)
  const processVideo = (frame) => {
    console.log(frame)
  }
  if (decoderRef.current === null) {
    decoderRef.current = new VideoDecoder({
      output: processVideo,
      error: (error) => console.log(error),
    })
  }
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoUploadHandler = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0])
      console.log(e.target.files)
      decoderRef.current?.configure({
        codec: 'vp8',
        codedHeight: 360,
        codedWidth: 640,
      })
      const arrBuffer = await e.target.files[0].arrayBuffer()
      const data = new Uint8Array(arrBuffer)
      const url = URL.createObjectURL(new Blob([data.buffer], { type: e.target.files[0].type }))
      console.log(url)
      setVideoUrl(url)
      videoRef.current?.addEventListener('canplay', async () => {
        await decoderRef.current?.configure({
          codec: 'vp8',
          codedHeight: 640,
          codedWidth: 480,
        })
        videoRef.current?.play()
      })
    }
  }
  useEffect(() => {
    if (videoRef.current) videoRef.current.src = videoUrl
  }, [videoUrl])

  return (
    <Flex flexDir={'column'} gap={5} p={2} w={'100dvw'} h={'100dvh'}>
      <Flex flexDir={'column'} gap={2}>
        <Input type='file' onChange={videoUploadHandler} />
        <Button>Transcode avi to mp4</Button>
      </Flex>
      {videoUrl && (
        <Flex>
          <video ref={videoRef}></video>
        </Flex>
      )}
    </Flex>
  )
}

export default App
