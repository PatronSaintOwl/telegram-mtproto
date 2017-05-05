//@flow

import uuid from 'uuid/v4'
import isNode from 'detect-node'

import { ProviderRegistryError } from './error'
import type { TLSchema } from './tl/index.h'
import type { Emit, EventEmitterType } from 'eventemitter2'
import Layout from './layout'
import cryptoCommon from './co-worker/common-provider'
import getCrypto from './co-worker'

type InstanceConfig = {|
  +uid: string,
  emit: Emit,
  +rootEmitter: EventEmitterType,
  signIn: boolean,
  +schema: {|
    apiSchema: TLSchema,
    mtSchema: TLSchema
  |},
  +layer: {|
    apiLayer: Layout,
    mtLayer: Layout,
  |},
  timerOffset: number,
  lastMessageID: [number, number]
|}

type Provider = {
  [uid: string]: InstanceConfig
}

type InstanceDiff = {
  uid: string,
  timerOffset: number,
  lastMessageID: [number, number]
}


const provider: Provider = { }

const common = {
  ...cryptoCommon
}

const Config = {
  signIn: {
    get: (uid: string) => getConfig(uid).signIn,
    set(uid: string, value: boolean) {
      getConfig(uid).signIn = value
    }
  },
  rootEmitter: (uid: string) => getConfig(uid).rootEmitter,
  emit       : (uid: string) => getConfig(uid).emit,
  layer      : {
    apiLayer: (uid: string) => getConfig(uid).layer.apiLayer,
    mtLayer : (uid: string) => getConfig(uid).layer.mtLayer,
  },
  schema: {
    get      : (uid: string) => getConfig(uid).schema,
    apiSchema: (uid: string) => getConfig(uid).schema.apiSchema,
    mtSchema : (uid: string) => getConfig(uid).schema.mtSchema,
  },
  timerOffset: {
    get: (uid: string) => getConfig(uid).timerOffset,
    set(uid: string, value: number) {
      getConfig(uid).timerOffset = value
    }
  },
  lastMessageID: {
    get: (uid: string) => getConfig(uid).lastMessageID,
    set(uid: string, value: [number, number]) {
      getConfig(uid).lastMessageID = value
    }
  },

  common
}

export type Common = typeof Config.common;

Config.common.Crypto = getCrypto(Config.common)

export function getConfig(uid: string) {
  const config = provider[uid]
  if (config == null) throw new ProviderRegistryError(uid)
  return config
}

const innerRegistrator = (config: *, uid: string) => {
  const fullConfig: InstanceConfig = {
    //$FlowIssue
    ...config,
    uid,
    timerOffset  : 0,
    lastMessageID: [0, 0]
  }
  provider[uid] = fullConfig
  return uid
}

export const curriedRegister = () => {
  const uid = uuid()
  return {
    uid,
    next: (config: $Diff<InstanceConfig, InstanceDiff>) => innerRegistrator(config, uid)
  }
}

export function registerInstance(config: $Diff<InstanceConfig, InstanceDiff>) {
  const uid = uuid()

  innerRegistrator(config, uid)
  return uid
}

export default Config