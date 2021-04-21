import { Injectable } from '@angular/core';
import { Client } from 'elasticsearch-browser';


@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {

  private client: Client;

  highValueRadars = [{"radarId":"23423"},
                     {"radarId":"23423"},
                     {"radarId":"23423"}
                    ];
  
  financialData = [{
    "radarId":"3452644",
    "solutions":[{"radarId":"23423",
                  "matching":"85"}, 
                  {"radarId":"7345389",
                  "matching":"40"}]
  },
  {
    "radarId":" 9898793",
    "solutions":[{"radarId":"454336",
                  "matching":"62"}, 
                  {"radarId":"7323289",
                  "matching":"50"}]
  }];

  getAllSolutions(): any { 
    //return this.financialData;
    return Promise.resolve(this.financialData);
  }

moreLikeThisDoc(_index, _type, id): any {
  return this.client.search({
    index: _index,
    type: _type,
    //filterPath: ['hits.hits._source', 'hits.total', '_scroll_id'],
    body: {
      'query': {
        'nested': {
          'path': 'search_data',
          'query': {
            'more_like_this' : {
                'like' :[
                {
                    '_id' : id
               }],
                'min_term_freq' : 1,
                'min_doc_freq':1
            }
         }
        }
      },
      "stored_fields": ["search_result_data.id"]
    }
  });
}

private queryallproducts = {
    '_source': [],
    'query': {
      'function_score': {
        'query': { 'match_all': {} },
        'boost': '5',
        'functions': [
          {
            'script_score': {
              'script': {
                'source': "(1 + _score * 0.5)* doc['scores.stock'].value * (0.1 * doc['scores.random'].value + 0.3 * doc['scores.top_seller'].value + 0.1 * doc['scores.pdp_impressions'].value + 0.2 * doc['scores.sale_impressions_rate'].value + 0.1 * doc['scores.data_quality'].value + 0.3 * doc['scores.delivery_speed'].value)"
              }
            }
          }
        ]
      }
    }
  };

  constructor() {
    if (!this.client) {
      this.connect();
    }
  }

  private connect() {
    this.client = new Client({
      host: 'http://elastic:Apple123@localhost:9200',
      log: 'trace'
   });
  }

  isAvailable(): any {
    return this.client.ping({
      requestTimeout: Infinity,
      body: 'Elasticsearch test'
    });
  }

  addToIndex(value): any {
    return this.client.create(value);
  }

  getAllDocuments(_index, _type): any {
    return this.client.search({
      index: _index,
      type: _type,
      body: this.queryalldocs,
      //filterPath: ['hits.hits._source', 'hits.total', '_scroll_id'],
    });
  }

  private queryalldocs = {
    //'_source': ['search_result_data.id'],
    //'stored_fields': ['search_result_data.id'],
    '_source': [],
    'query': {
      'function_score': {
        'query': { 'match_all': {} },
      }
    }
  }

  getAllDocumentsWithScroll(_index, _type, _size): any {
    return this.client.search({
      index: _index,
      type: _type,
      scroll: '1m',
      filterPath: ['hits.hits._source', 'hits.total', '_scroll_id'],
      body: {
        'size': _size,
        'query': {
          'match_all': {}
        },
        'sort': [
          { '_uid': { 'order': 'asc' } }
        ]
      }
    });
  }

  getNextPage(scroll_id): any {
    return this.client.scroll({
      scrollId: scroll_id,
      scroll: '1m',
      filterPath: ['hits.hits._source', 'hits.total', '_scroll_id']
    });
  }

  fullTextSearch(_index, _type, _field, _queryText): any {
    return this.client.search({
      index: _index,
      type: _type,
      filterPath: ['hits.hits._source', 'hits.total', '_scroll_id'],
      body: {
        'query': {
          'nested': {
            'path': 'search_data',
            'query': {
              'match': {
                [_field]: _queryText,
              }
            }
          }
        }
      },
      '_source': []
    });
  }

  searchSuggest(_index, _type, _field, _queryText): any {
    return this.client.search({
      index: _index,
      type: _type,
      filterPath: [],
      body: {
        'size': 0,
        'suggest': {
          'searchsuggest': {
            'text': _queryText,
            'term': {
              'field': _field
            }
          }
        }
      },
      '_source': []
    });
  }

  aggregationSearch(_index, _type): any {
    return this.client.search({
      index: _index,
      type: _type,
      body: {
        'size': 0,
        "aggs": {
          "agg_string_facet": {
            "nested": {
              "path": "search_data.string_facets"
            },
            "aggs": {
              "facet_make": {
                "terms": { "field": "search_data.string_facets.facet-name" },

                "aggs": {
                  "facet_values": {
                    "terms": { "field": "search_data.string_facets.facet-value" }
                  }
                }
              }
            }
          }
        }
      },
      '_source': []
    });
  }


  aggregationSearchWithFilter(_index, _type, category, key): any {
    return this.client.search({
      index: _index,
      type: _type,
      body: {
        "query": {
          "bool": {
            "must": [
              {
                "nested": {
                  "path": "search_data.string_facets",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "match": {
                            "search_data.string_facets.facet-name": category
                          }
                        },
                        {
                          "match": {
                            "search_data.string_facets.facet-value": key
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        },
        "aggregations": {
          "agg_string_facet": {
            "nested": {
              "path": "search_data.string_facets"
            },
            "aggregations": {
              "facet_make": {
                "terms": {
                  "field": "search_data.string_facets.facet-name"
                }
              }
            }
          }
        }
      },
      '_source': []
    });
  }
}
