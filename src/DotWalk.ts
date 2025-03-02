export class DotWalk {
    private model: any;

    constructor(model: string) {
        this.model = model;
        return this.getProxy(model);
    }

    private getProxy(model: any) {

        const handler: ProxyHandler<any> = {
            get(target, prop) {
                if (prop === 'toString') {
                    return target[prop].bind(target);
                }

                let obj = {
                    ...target,
                    props: target.props ? [...target.props, prop] : [prop],
                };

                obj.__proto__.toString = async function () {
                    return await DotWalk.processDotWalk(this.model, this.props);
                }

                return new Proxy(obj, handler)
            }
        }

        return new Proxy({ model }, handler);
    }

    private static async processDotWalk(model: any, props: string[]) {
       console.log(model,props)
    }

    query() {
        console.log('query')
    }

}
