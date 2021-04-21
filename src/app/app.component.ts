import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { interval } from 'rxjs';
import { ElasticsearchService } from './elasticsearch-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'iPredict';
  uuid = '';
  allRadars = [];
  allMatch = [];
  newRadarsToCheck = [];
  highValue = [];
  possibleSolution = [];
  
  /*
{
    "radarId":"3452644",
    "solutions":[{"radarId":"23423",
                  "matching":"85"}, 
                  {"radarId":"7345389",
                  "matching":"40"}]
}
  */
  constructor(private es: ElasticsearchService){
    interval(5000).subscribe(x => {
        this.uuid = uuidv4();

        this.es.getAllDocuments('amp','radar')
        .then(response => {
          if(!!response.hits && !!response.hits.hits)  {
            //console.log("##### ID:" + response.hits.hits[0]._id);
            this.allRadars = response.hits.hits.map(function (entry) {
              //return entry._source.search_result_data.id;
              return entry._id;
            });
            //this.allRadars = response.hits.hits.map(entry => entry._source.search_result_data.id);
            this.newRadarsToCheck = this.allRadars.filter(value => !this.possibleSolution.includes(value));
            //console.log(this.newRadarsToCheck);

            this.newRadarsToCheck.forEach(element => {
              //console.log(element);
              this.es.moreLikeThisDoc('amp','radar', element)
              .then (response => {
                this.allMatch = response.hits.hits.map(function (entry) {
                  return entry;
                });
                //console.log(this.allMatch[0].fields["search_result_data.id"][0]);
                //console.log(this.allMatch[0]._score);
                //populate possible
                var index = this.possibleSolution.findIndex(x => x.radarId
                                          == element);
                        index === -1 ? this.possibleSolution.push({
                        "radarId":element,
                        "solutions":[{"radarId":this.allMatch[0].fields["search_result_data.id"][0],
                        "matching":this.allMatch[0]._score}],
                        }) : console.log("no data found");
                
              })
            })
          }
        });

        /*this.es.moreLikeThisDoc('amp','radar')
            .then (response => {
              var index = this.possibleSolution.findIndex(x => x.radarId
                                                          == response._source.search_result_data.id);
                 index === -1 ? this.possibleSolution.push({
                   "radarId":response._source.search_result_data.id,
                   "solutions":[{"radarId":"23423",
                  "matching":"85"}],
                 }) : console.log("no data found");
            }).error => {
              console.error(error);
            }).then(() => {
              //console.log(this.allRadars);
            });
         */   


        //console.log(this.uuid); 
        /*
        this.es.getAllSolutions()
        .then(response => {
          console.log(response);
          this.returnObj = response;
        }, error => {
          console.error(error);
        }).then(() => {
          console.log('Show Product Completed!');
        });
        
        this.es.getAllProducts('opes', 'phone')
          .then(response => {
            //this.productSources = response.hits.hits;
            this.returnObj = response.hits.hits;
            console.log(this.returnObj[0]._source.search_data[0].full_text);
          }, error => {
            console.error(error);
          }).then(() => {
            console.log('Show Product Completed!');
          });
          */
      });
 }
  ngOnInit(): void {
    /*this.es.getAllProducts('opes', 'phone')
      .then(response => {
        //this.productSources = response.hits.hits;
        this.returnObj = response.hits.hits;
        //console.log(this.returnObj[0]._source.search_data[0].full_text);
      }, error => {
        console.error(error);
      }).then(() => {
        console.log('Show Product Completed!');
      });
      */
  }

  getBgColor(val): any {
    return 'green';
  }

  getColor(val): any {
    return 'white';
  }
  
}
