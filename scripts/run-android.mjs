import {existsSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const env={...process.env};
const localTools=path.join(root,'.android-tools');
if(!env.JAVA_HOME&&existsSync(localTools)){
 const jdk=readdirSync(localTools).find(name=>existsSync(path.join(localTools,name,'Contents/Home/bin/javac')));
 if(jdk)env.JAVA_HOME=path.join(localTools,jdk,'Contents/Home');
}
if(!env.ANDROID_HOME&&existsSync(path.join(localTools,'sdk')))env.ANDROID_HOME=path.join(localTools,'sdk');
env.GRADLE_USER_HOME??=path.join(localTools,'gradle');
const task=process.argv[2]??'assembleDebug';
if(!['assembleDebug','assembleRelease','bundleRelease','lintDebug'].includes(task))throw Error('Unsupported Android task');
const result=spawnSync('./gradlew',[`:app:${task}`,'--console=plain','--no-daemon'],{cwd:path.join(root,'android'),env,stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status??1;
