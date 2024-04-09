import { useState } from "react"
import MP4Box from 'mp4box'
export default (track) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoTrack, setVideoTrack] = useState()
  const [audioTrack, setAudioTrack] = useState<any>()
  const [inputUrl, setInputUrl] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [audioChunks, setAudioChunks] = useState<any>([])
  const [videoFrames, setVideoFrames] = useState<FrameInfo[]>([])
  const handleTrack = () =>{}
}