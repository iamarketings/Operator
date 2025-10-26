export interface Call {
  id: string;
  callerId: string;
  destination: string;
  startTime: number;
  duration: number;
  channel: string;
  state: 'Ringing' | 'Up' | 'Down';
}

export interface Extension {
  id: string;
  name: string;
  number: string;
  secret: string;
  protocol: 'PJSIP' | 'SIP';
  status: 'Registered' | 'Unregistered' | 'Ringing' | 'In Use' | 'Unavailable';
  ipAddress: string;
  userAgent: string;
  voicemail: {
    enabled: boolean;
    pin?: string;
    email?: string;
  };
  callRecording: {
    incoming: boolean;
    outgoing: boolean;
  };
}

export interface Trunk {
  id: string;
  name: string;
  type: 'PJSIP' | 'SIP' | 'IAX2';
  status: 'Registered' | 'Unregistered' | 'Unreachable';
  host: string;
}

export interface Queue {
  id: string;
  name: string;
  strategy: 'ringall' | 'roundrobin' | 'leastrecent' | 'random';
  waitingCalls: number;
  members: QueueMember[];
}

export interface QueueMember {
    id: string;
    name: string;
    status: 'Logged In' | 'Logged Out' | 'In Use' | 'Ringing';
}

export interface CDR {
    id: string;
    calldate: string;
    clid: string;
    src: string;
    dst: string;
    dcontext: string;
    channel: string;
    dstchannel: string;
    lastapp: string;
    lastdata: string;
    duration: number;
    billsec: number;
    disposition: 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED';
    amaflags: number;
    accountcode: string;
    uniqueid: string;
    userfield: string;
    recordingfile?: string;
}

export interface AsteriskStats {
  activeCalls: number;
  registeredExtensions: number;
  registeredTrunks: number;
  activeConferences: number;
}

export interface CallActivityData {
  time: string;
  calls: number;
}
