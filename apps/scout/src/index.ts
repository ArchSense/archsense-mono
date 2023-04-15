import { writeFile } from 'fs/promises';
import { getApps } from './services/apps';
import { buildStaticInsights } from './services/ast';
import { getValidConfig } from './services/config';
import { Config } from './types/config';
import { AnalysisResult } from './types/output';
import { Path } from './types/path';
import path from 'path';
import { readdirSync } from 'fs';

export * from './types';

type Params = {
  configPath?: Path;
  rootPath?: Path;
  framework: 'nestjs';
};

export class Scout {
  constructor(private params: Params) {
    this.validateParams();
    this.debugCI();
  }

  private debugCI() {
    const rootPath = path.resolve(process.cwd(), '../');
    console.log(rootPath);
    const rootContent = readdirSync(rootPath)
    console.log(rootContent);
    if (rootContent.includes('guinea-pig-nestjs')) {
      const folderPath = path.resolve(process.cwd(), '../guinea-pig-nestjs');
      console.log(folderPath);
      const gp = readdirSync(folderPath);
      console.log(gp);
    }
  }

  private validateParams() {
    if (!this.params.configPath && !this.params.rootPath) {
      throw new Error('Path to config or to root project should be specified');
    }
  }

  private getConfig(): Config {
    const config = getValidConfig(this.params.configPath, this.params.rootPath);
    if (!config) {
      throw new Error('Could not find config');
    }
    console.log('Running with config:', JSON.stringify(config));
    return config;
  }

  public async analyze(): Promise<AnalysisResult> {
    const config = this.getConfig();
    const apps = await getApps(config);
    const res: AnalysisResult = {};
    for (let [name, path] of Object.entries(apps)) {
      const components = await buildStaticInsights(path);
      res[name] = {
        id: name,
        components: Object.fromEntries(components),
      };
    }
    return res;
  }

  public async saveToFile(destination: Path, data: any) {
    await writeFile(destination, JSON.stringify(data, null, 2));
  }
}
