import React, { useState, useEffect, useCallback } from 'react';
import type {TrackReferenceOrPlaceholder} from '@livekit/components-react';
import {
    LiveKitRoom,
    VideoTrack,
    useTracks,
    useLocalParticipant,
    useRoomContext,
    useParticipants
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { Loader2, AlertTriangle, MonitorUp, MonitorX, Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';
import { useSocket } from '../../context/socketHandler.js';
import { useUser } from '../../context/userContext.js';

interface IncomingCallData {
    token: string;
    from: string;
}

const CallOverlay = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-20 p-4">
        {children}
    </div>
);

const ShareScreenButton = () => {
    const { localParticipant, isScreenShareEnabled } = useLocalParticipant();

    const toggleScreenShare = useCallback(async () => {
        if (!localParticipant) return;

        try {
            await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true });
        } catch (err) {
            console.error('Failed to toggle screen share:', err);
        }
    }, [localParticipant, isScreenShareEnabled]);

    return (
        <button
            onClick={toggleScreenShare}
            className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center gap-1 sm:gap-2 transition-colors ${
                isScreenShareEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
        >
            {isScreenShareEnabled ? <MonitorX size={14} className="sm:w-4 sm:h-4" /> : <MonitorUp size={14} className="sm:w-4 sm:h-4" /> }
            <span className="hidden xs:inline">{isScreenShareEnabled ? 'Stop Share' : 'Share Screen'}</span>
            <span className="xs:hidden">{isScreenShareEnabled ? 'Stop' : 'Share'}</span>
        </button>
    );
};

const MediaControls = ({ onLeave }: { onLeave: () => void }) => {
    const { localParticipant } = useLocalParticipant();
    const { isMicrophoneEnabled, isCameraEnabled } = localParticipant;

    const toggleMic = useCallback(async () => {
        try {
            await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        } catch (err) {
            console.error('Mic toggle error:', err);
        }
    }, [localParticipant, isMicrophoneEnabled]);

    const toggleCamera = useCallback(async () => {
        try {
            await localParticipant.setCameraEnabled(!isCameraEnabled);
        } catch (err) {
            console.error('Camera toggle error:', err);
        }
    }, [localParticipant, isCameraEnabled]);

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <button
                onClick={toggleMic}
                className={`p-2 sm:p-3 rounded-full transition-colors ${
                    isMicrophoneEnabled
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
            >
                {isMicrophoneEnabled ? <Mic size={16} className="sm:w-5 sm:h-5" /> : <MicOff size={16} className="sm:w-5 sm:h-5" />}
            </button>
            <button
                onClick={toggleCamera}
                className={`p-2 sm:p-3 rounded-full transition-colors ${
                    isCameraEnabled
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
            >
                {isCameraEnabled ? <Video size={16} className="sm:w-5 sm:h-5" /> : <VideoOff size={16} className="sm:w-5 sm:h-5" />}
            </button>
            <ShareScreenButton />
            <button
                onClick={onLeave}
                className="p-2 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
                <Phone size={16} className="sm:w-5 sm:h-5" />
            </button>
        </div>
    );
};



interface ParticipantTileProps {
    trackRef: TrackReferenceOrPlaceholder;
}

const ParticipantTile = ({ trackRef }: ParticipantTileProps) => {
    if (!trackRef || !trackRef.publication) {
        return null;
    }

    const isScreenShare = trackRef.source === Track.Source.ScreenShare;

    return (
        <div className="relative bg-slate-800 rounded-lg overflow-hidden h-full w-full aspect-video">
            <VideoTrack
                trackRef={trackRef}
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black bg-opacity-60 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                {trackRef.participant.identity}
                {isScreenShare && ' (Screen)'}
            </div>
            {!isScreenShare && (
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black bg-opacity-50 p-0.5 sm:p-1 rounded-full">
                    {trackRef.participant.isMicrophoneEnabled ? (
                        <Mic size={12} className="text-green-400 sm:w-3.5 sm:h-3.5" />
                    ) : (
                        <MicOff size={12} className="text-red-400 sm:w-3.5 sm:h-3.5" />
                    )}
                </div>
            )}
        </div>
    );
};

const VideoGrid = () => {
    const tracks = useTracks(
        [Track.Source.Camera, Track.Source.ScreenShare],
        { onlySubscribed: true }
    );
    const participants = useParticipants();

    const screenShareTracks = tracks.filter(
        trackRef => trackRef.source === Track.Source.ScreenShare
    );
    const cameraTracks = tracks.filter(
        trackRef => trackRef.source === Track.Source.Camera
    );

    const localCameraTrack = cameraTracks.find(track => track.participant.isLocal);
    const remoteCameraTracks = cameraTracks.filter(track => !track.participant.isLocal);
    const orderedCameraTracks = localCameraTrack ? [localCameraTrack, ...remoteCameraTracks] : remoteCameraTracks;

    if (tracks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                    <VideoOff size={48} className="mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-300">
                        {participants.length === 0
                            ? 'Waiting for participants...'
                            : 'No video streams available.'}
                    </p>
                </div>
            </div>
        );
    }

    if (screenShareTracks.length > 0) {
        const mainScreenShare = screenShareTracks[0];
        return (
            <div className="w-full h-full flex flex-col p-2 sm:p-4 gap-2 sm:gap-4">
                <div className="flex-grow min-h-0">
                    <ParticipantTile trackRef={mainScreenShare} />
                </div>
                {orderedCameraTracks.length > 0 && (
                    <div className="w-full h-28 sm:h-36 md:h-40 flex-shrink-0">
                        <div className="grid grid-flow-col auto-cols-[45%] sm:auto-cols-[30%] md:auto-cols-[200px] lg:auto-cols-[240px] gap-2 sm:gap-3 h-full overflow-x-auto">
                            {orderedCameraTracks.map(trackRef =>
                                trackRef.publication ? <ParticipantTile key={trackRef.publication.trackSid} trackRef={trackRef} /> : null
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full h-full p-2 sm:p-4">
            <div className="grid gap-2 sm:gap-4 h-full w-full items-center justify-center"
                 style={{
                     gridTemplateColumns: `repeat(auto-fit, minmax(clamp(150px, 40vw, 450px), 1fr))`,
                 }}>
                {orderedCameraTracks.map(trackRef =>
                    trackRef.publication ? <ParticipantTile key={trackRef.publication.trackSid} trackRef={trackRef} /> : null
                )}
            </div>
        </div>
    );
};

const RoomContent = ({ onLeave }: { onLeave: () => void }) => {
    const room = useRoomContext();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const handleConnectionChange = () => {
            setIsConnected(room.state === 'connected');
        };

        handleConnectionChange();
        room.on(RoomEvent.ConnectionStateChanged, handleConnectionChange);

        return () => {
            room.off(RoomEvent.ConnectionStateChanged, handleConnectionChange);
        };
    }, [room]);

    if (!isConnected) {
        return (
            <CallOverlay>
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <span>Connecting to room...</span>
            </CallOverlay>
        );
    }

    return (
        <div className="relative h-full w-full">
            <VideoGrid />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                <MediaControls onLeave={onLeave} />
            </div>
        </div>
    );
};

function VideoCall({ chat }: { chat: { _id: string; name: string } }) {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [publishAudio, setPublishAudio] = useState(true);
    const [publishVideo, setPublishVideo] = useState(true);
    const [showOptions, setShowOptions] = useState(true);
    const [isInCall, setIsInCall] = useState(false);
    const socket = useSocket();
    const { user } = useUser();
    const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

    const handleJoinWithOptions = useCallback(() => {
        if (!socket || !user || !chat) return;

        if (!serverUrl) {
            setError("Video service is not configured. Please contact the administrator.");
            console.error("VITE_LIVEKIT_URL is not set in the environment variables.");
            return;
        }

        setShowOptions(false);
        setIsLoading(true);
        setError(null);

        socket.emit(
            'join-video-room',
            {
                roomId: chat._id,
                creator: user.username
            },
            (response: { success: boolean; token?: string; message?: string }) => {
                setIsLoading(false);
                if (response.success && response.token) {
                    setToken(response.token);
                    setIsInCall(true);
                } else {
                    setError(response.message || 'Failed to get video token.');
                    setShowOptions(true);
                }
            }
        );
    }, [socket, user, chat, serverUrl]);

    const handleLeaveCall = useCallback(() => {
        setToken(null);
        setIsInCall(false);
        setShowOptions(true);
        setError(null);
    }, []);

    const handleRetry = useCallback(() => {
        setError(null);
        setShowOptions(true);
    }, []);

    useEffect(() => {
        if (!serverUrl) {
            setError("Video service is not configured. Please contact the administrator.");
        } else if (!socket || !chat?._id || !user?._id) {
            setError("Missing required data. Please refresh and try again.");
        }
    }, [socket, user, chat, serverUrl]);

    useEffect(() => {
        if (socket) {
            const handleIncomingCall = ({ token, from }: IncomingCallData) => {
                console.log(`Incoming call from ${from}`);
                setToken(token);
                setIsInCall(true);
                setShowOptions(false);
            };

            socket.on('incoming-video-call', handleIncomingCall);

            return () => {
                socket.off('incoming-video-call', handleIncomingCall);
            };
        }
    }, [socket]);

    return (
        <div className="relative h-full w-full bg-slate-900 overflow-hidden">
            {isLoading && (
                <CallOverlay>
                    <div className="text-center text-gray-700">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 mx-auto text-indigo-600" />
                        <span className="text-lg font-medium">Joining video call...</span>
                    </div>
                </CallOverlay>
            )}

            {error && !isLoading && (
                <CallOverlay>
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 mx-auto" />
                        <p className="text-red-600 mb-6 text-center">
                            {error}
                        </p>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold"
                        >
                            Try Again
                        </button>
                    </div>
                </CallOverlay>
            )}

            {showOptions && !isLoading && !error && (
                <CallOverlay>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900">Ready to join?</h2>
                            <p className="text-gray-500 mt-2">Room: <span className="font-semibold text-gray-700">{chat.name}</span></p>
                        </div>

                        <div className="space-y-6 mb-10">
                            <label htmlFor="audio-toggle" className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="flex items-center gap-4 text-gray-800 font-medium">
                                    <Mic size={22} className="text-purple-500" />
                                    Enable Microphone
                                </span>
                                <div className="relative">
                                    <input
                                        id="audio-toggle"
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={publishAudio}
                                        onChange={(e) => setPublishAudio(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </div>
                            </label>

                            <label htmlFor="video-toggle" className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="flex items-center gap-4 text-gray-800 font-medium">
                                    <Video size={22} className="text-indigo-500" />
                                    Enable Camera
                                </span>
                                <div className="relative">
                                    <input
                                        id="video-toggle"
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={publishVideo}
                                        onChange={(e) => setPublishVideo(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={handleJoinWithOptions}
                            disabled={!socket || !user || !chat}
                            className="w-full py-3 px-4 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            Join Call Now
                        </button>
                    </div>
                </CallOverlay>
            )}

            {token && isInCall && serverUrl && (
                <LiveKitRoom
                    token={token}
                    serverUrl={serverUrl}
                    video={publishVideo}
                    audio={publishAudio}
                    data-lk-theme="default"
                    style={{ height: '100%', width: '100%' }}
                    onDisconnected={handleLeaveCall}
                >
                    <RoomContent onLeave={handleLeaveCall} />
                </LiveKitRoom>
            )}
        </div>
    );
}

export default VideoCall;
